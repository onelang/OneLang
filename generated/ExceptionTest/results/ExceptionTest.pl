use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub notThrows {
    my ( $self ) = @_;
    return 5;
}

sub fThrows {
    my ( $self ) = @_;
    die "exception message"."\n";
}

sub testMethod {
    my ( $self ) = @_;
    print(($self->notThrows()) . "\n");
    $self->fThrows();
}

package Program;

eval {
    my $c = new TestClass();
    $c->testMethod();
};
if ($@) {
    print "Exception: " . $@
}