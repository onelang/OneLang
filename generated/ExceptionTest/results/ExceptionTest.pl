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

sub not_throws {
    my ( $self ) = @_;
    return 5;
}

sub f_throws {
    my ( $self ) = @_;
    die "exception message"."\n";
}

sub test_method {
    my ( $self ) = @_;
    print(($self->not_throws()) . "\n");
    $self->f_throws();
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}