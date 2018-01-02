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

sub get_result {
    my ( $self ) = @_;
    return 1;
}

sub test_method {
    my ( $self ) = @_;
    print(($self->get_result() ? "true" : "false") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}